import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';

export default {
	mode: 'production',
	target: 'web',
	entry: {
		contentScript: './src/content/index.ts',
		background: './src/background/index.ts',
		popup: './src/popup.ts',
	},
	output: {
		path: path.resolve(import.meta.dirname, 'dist'),
		filename: '[name].js',
		clean: true,
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/index.html',
		}),
		new CopyPlugin({
			patterns: [{
				from: path.resolve('./src/popup.html'),
				to: path.resolve('dist'),
			}]
		}),
		new CopyPlugin({
			patterns: [{
				from: path.resolve('manifest.json'),
				to: path.resolve('dist'),
			}]
		})
	],
	module: {
		rules: [
			{
				test: /\.ts?$/,
				exclude: /node_modules/,
				use: "ts-loader"
				// {
				// 	loader: 'babel-loader',
				// 	options: {
				// 		presets: [
				// 			'@babel/preset-env',
				// 			// ['@babel/preset-react', {runtime: 'automatic'}],
				// 			'@babel/preset-typescript',
				// 		],
				// 	},
				// },
			},
			// {
			// 	test: /\.{js|jsx|ts|tsx}/,
			// 	exclude: /node_modules/,
			// 	use: {
			// 		loader: 'babel-loader',
			// 		  options: {
			// 			presets: ["@babel/preset-env", "solid"]
			// 		}
			// 	}
			// },
			// {
			// 	test: /\.{ts|tsx}$/,
			// 	exclude: /node_modules/,
			// 	use: {
			// 		loader: 'babel-loader',
			// 		options: {
			// 			presets: [
			// 				'@babel/preset-env',
							// ['@babel/preset-react', {runtime: 'automatic'}],
			// 				'@babel/preset-typescript',
			// 			],
			// 		},
			// 	},
			// },
		]
	},
	resolve: {
		extensions: ['.ts', '.tsx'],
	},
};
